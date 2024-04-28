import express, {Request, Response} from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";

const router = express.Router();

// /api/users/register
router.post("/register", 
[
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters is required").isLength({min:6}),
], 
async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json(({message: errors.array()}));
    }
    try {
        let user = await User.findOne({
            email: req.body.email,
        }); //check whether user exists or not

        if(user) {
            return res.status(400).json({ message: "User already exists"});
        }//if user exists

        user = new User(req.body)
        await user.save();//if user doesn't exist, create a new user

        const token = jwt.sign({userId: user.id}, 
            process.env.JWT_SECRET_KEY as string, {//encrypting
                expiresIn: "1d",//expires in 1 day
            }
            );

            res.cookie("auth token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 86400000,//miliseconds
            })
            return res.sendStatus(200);

    }catch(error){
        console.log(error);
        res.status(500).send({message: "Something went wrong"})
    }//a bad error 
});

export default router;

function check(arg0: string, arg1: string) {
    throw new Error("Function not implemented.");
}

