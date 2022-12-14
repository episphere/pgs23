(async()=>{
    pgs23 = await import('https://episphere.github.io/pgs23/export.js')
    //pgs23 = await import('http://localhost:8000/pgs23/export.js')
    if(typeof(define)!='undefined'){
        define(pgs23)
    }
})()
