function NotFound(){
    return(
        <>
            <h1>Page not found :(</h1>
            <button onClick={() => {window.location = "/"}}>Go back Home</button>
        </>
    )
}

export default NotFound