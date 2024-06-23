import { useForm } from "react-hook-form";

type RegisterFormData = {
    email : string,
    password : string,
    confirmPassword : string;
}

const Register = () => {

    const {register, watch, handleSubmit, formState: {errors},} = useForm<RegisterFormData>();
    const onSubmit = handleSubmit((data)=> {
        console.log(data);
    });

    return (
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <h2 className="text-3xl font-bold">Create an Account</h2>
                <label className="text-garay-700 text-sm font-bold">
                    Email <input type = "email" className="border rounded w-full py-1 px-2 font-normal"{...register("email", {required: "This field is required"})}>
                    </input>
                    {errors.email && (
                        <span className="text-red-500">{errors.email.message}</span>
                    )}
                </label>
                <label className="text-garay-700 text-sm font-bold">
                    Password 
                    <input type = "password" className="border rounded w-full py-1 px-2 font-normal"{...register("password", {required: "This field is required", minLength: {value: 6, message: "Password must be at least 6 characters"}})}>
                    </input>
                    {errors.password && (
                        <span className="text-red-500">{errors.password.message}</span>
                    )}
                </label>
                <label className="text-garay-700 text-sm font-bold">
                    Confirm Password 
                    <input type = "password" className="border rounded w-full py-1 px-2 font-normal"{...register("confirmPassword", 
                    {validate: (val)=> {
                        if(!val){
                            return "This field is required"
                        } else if(watch("password") !== val){
                            return "Your password does not match"
                        }
                    } })}>
                    </input>
                    {errors.confirmPassword && (
                        <span className="text-red-500">{errors.confirmPassword.message}</span>
                    )}
                </label>
                <span>
                    <button type="submit" className="bg-green-800 text-white p-2 font-bold hover:bg-green-500 text-xl">Create Account</button>
                </span>
        </form>
    );
};

export default Register;