//this is file is made for our ease in which way the api error are coming
class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""
    ){
        //overite constructor
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.mesage=message
        this.success=false,
        this.errors=errors
//not needed written in productiongrade //usually the api error trace has many long lines of codes so this is 
//used to write that to trace error in lines like line 48 has error etc
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}