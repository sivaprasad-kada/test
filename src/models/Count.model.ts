import mongoose from "mongoose";
type Count = {
    name: string,
    count: number,
}
const CountSchema = new mongoose.Schema<Count>({
    name: {
        type: String,
        required: true,
        unique: true
    },
    count: {
        type: Number,
        required: true,
        default: 0
    }
})
export const CountModel = mongoose.model<Count>("Count", CountSchema)