//packages\backend\src\models\User.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
    email: string;
    password?: string;
    name?: string;
    otpHash?: string;
    otpExpiry?: Date;
    registrationToken?: string;            // ← add
    registrationTokenExpiry?: Date;        // ← add
    comparePassword?(candidate: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String },
        name: String,
        otpHash: String,
        otpExpiry: Date,
        registrationToken: String,          // ← add
        registrationTokenExpiry: Date,      // ← add
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
    if (!this.password) return false;
    return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>('User', userSchema);