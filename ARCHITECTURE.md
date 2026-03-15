# URL Shortener Architecture

This document describes the complete, scalable architecture of the URL Shortener backend, built to support millions of redirects with minimal latency while safely collecting asynchronous analytics.

## 1. System Architecture

The core philosophy of this architecture is **Decoupled Analytics from the Hot Path (Redirects)**.

When a user visits a short link:
1. **Redirect API**: Extracts the `shortId`.
2. **Cache Check**: Looks up `shortId` in Redis (`url:{shortId}`).
3. **Redirect**:
   - **Cache Hit**: Returns `302 Redirect` immediately (sub-millisecond latency).
   - **Cache Miss**: Queries MongoDB, populates Redis, then redirects.
4. **Analytics Queue**: Immediately *after* redirecting (or non-blocking via `.catch`), pushes the request metadata to a BullMQ queue.
5. **Analytics Worker**: Processes jobs in the background, updating Redis counters continuously without touching the main database.
6. **Periodic Aggregator**: A node-cron scheduler runs periodically (e.g., every 5 minutes), reads aggregated data from Redis, converts it to daily documents, and upserts them into MongoDB.

## 2. Caching Strategy
We use the **Cache-Aside (Lazy Loading)** pattern. 
- Fast path: Redis (`url:{shortId}`) -> Response.
- Slow path (Miss): MongoDB -> Save to Redis -> Response.
- TTL is configured efficiently (e.g., 24 hours), avoiding stale links staying indefinitely in Redis while minimizing Cache misses.

## 3. Cache Invalidation
Whenever a URL is modified (via `PUT /api/url/:shortId`) or deleted (via `DELETE /api/url/:shortId`), the `url.service.ts` actively calls the Cache Service to invalidate the keys in Redis using `DEL url:{shortId}`. This guarantees users never follow an outdated redirect.

## 4. Redis Eviction Policy
To ensure Redis does not run out of memory, we must configure its `maxmemory-policy` to `allkeys-lru`.
This ensures that if Redis reaches its memory limit, it will safely evict the least recently used keys, prioritizing hot URLs in cache. The short generation keys (`url_counter`) and analytics counters are safe because they rotate out naturally or maintain relatively few keys. 

## 5. Analytics Pipeline
1. **Extraction**: `ip.util`, `useragent.util`, and `geo.util` quickly glean IP, browser, and geo-data.
2. **Buffering**: Data is added to `analyticsQueue` using BullMQ.
3. **Aggregating (Redis)**: The Worker handles queue messages by writing to a daily hash: `analytics:{shortId}:{date}` using `HINCRBY` and counting unique users via `PFADD` on a HyperLogLog `unique:{shortId}:{date}`.
4. **Persisting**: The Aggregator script scans `analytics:*` keys, pulls down the data, writes to MongoDB, and then deletes the keys `DEL`, freeing Redis.

## 6. BullMQ Workers
BullMQ isolates analytics from regular processing. If traffic spikes and thousands of clicks come in, BullMQ queues them gracefully, avoiding DB saturation. Concurrency and job retry logs ensure high availability and reliability. Worker failure does not affect users being redirected.

## 7. Redis Aggregation
The pipeline aggregates analytics in Redis first. Instead of inserting 10,000 documents per minute into MongoDB, it does 10,000 `HINCRBY` operations in Redis, and ONE `findOneAndUpdate` with MongoDB at the end of every 5-minute interval. This turns MongoDB writes from $O(N)$ requests to $O(1)$ per time-interval.

## 8. MongoDB Schema
To support high-performance analytics, our Schema leverages a `{shortId, date}` compound index.
Each URL gets exactly **one document per day** in the `Analytics` collection, storing cumulative counts for that day, broken down by Countries, Browsers, and Devices.

## 9. Redirect Optimization
All analytics operations during a redirect are pushed out of the execution line. The HTTP `res.redirect()` gets triggered instantly after retrieving the URL, and only after the network pipe has flushed the redirection do we fire the fast `enqueueAnalyticsJob()`.

## 10. Scaling Strategy
- **Web Nodes**: Completely stateless, scale horizontally using load balancers (e.g., NGINX).
- **Redis Node**: Handled heavily. The LRU policy and lightweight structs allow millions of keys per GB.
- **Worker Nodes**: Separate your Node instances that handle BullMQ Workers into background services.
- **Database**: The structure enforces that MongoDB primarily receives bulk metric updates, keeping disk IOPS extremely low, allowing read scaling via replicas if needed.
