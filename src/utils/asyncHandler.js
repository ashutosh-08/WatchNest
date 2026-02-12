//FROM PROMISE

const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error) =>next(error))
    }
}

export {asyncHandler}


//FROM TRY CATCH

/*the asyncHandler take the input as a higher order function
eg-
const asyncHandler=(fn)=>{ (fn1)=>{} }
so above asynchandler is a higher order function becasue it takes function as input and inside the function there is also a function*/

/*const asyncHandler = (fn)=> async (req,res,next)=>{
    try{
        await fn(req,res,next)
    }
    catch(error){
        //just to make things more standardise
        res.status(error.code || 500).json({
            success: false,
            message:error.message
        })
    }
}
export {asyncHandler}*/