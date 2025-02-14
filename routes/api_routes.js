import dns from "dns";
import express, { Router } from "express";
import crypto from "crypto";
import axios from "axios";

let sale_info
let pay_status

const router = express.Router();

router.use(express.json())
router.use(express.text())
router.use(express.urlencoded())


router.use('/notify_url', (request, response) => {//get is a request fuction from client

    response.sendStatus(200)


    const testingMode = true;
    let pfHost = testingMode ? "sandbox.payfast.co.za" : "www.payfast.co.za";

    let payFastData = JSON.parse(JSON.stringify(request.body));
    console.log("ITN DATA",request.body)

    let pfParamString = "";
    for (let key in payFastData) {
        if (payFastData.hasOwnProperty(key) && key !== "signature") {
            pfParamString += `${key}=${encodeURIComponent(payFastData[key].trim()).replace(/%20/g, "+")}&`;
        }
    }

    // Remove last ampersand
    pfParamString = pfParamString.slice(0, -1);

    const pfValidSignature = (payFastData, pfParamString, pfPassphrase = null) => {
        // Calculate security signature

        if (pfPassphrase !== null) {
            pfParamString += `&passphrase=${encodeURIComponent(pfPassphrase.trim()).replace(/%20/g, "+")}`;
        }

        const signature = crypto.createHash("md5").update(pfParamString).digest("hex");
        return payFastData.signature === signature;
    };

    async function ipLookup(domain) {
        return new Promise((resolve, reject) => {
            dns.lookup(domain, { all: true }, (err, address, family) => {
                if (err) {
                    reject(err)
                } else {
                    const addressIps = address.map(function (item) {
                        return item.address;
                    });
                    resolve(addressIps);
                }
            });
        });
    }

    const pfValidIP = async (req) => {
        const validHosts = [
            'sandbox.payfast.co.za',
            'www.payfast.co.za',
            'w1w.payfast.co.za',
            'w2w.payfast.co.za'
        ];

        let validIps = [];
        const pfIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log("itn ip test",pfIp)
        try {
            for (let key in validHosts) {
                const ips = await ipLookup(validHosts[key]);
                validIps = [...validIps, ...ips];
                console.log(validIps)
            }
        } catch (err) {
            console.error(err);
        }

        const uniqueIps = [...new Set(validIps)];

        if (uniqueIps.includes(pfIp)) {
            return true;
        }
        return false;
    };

    const pfValidPaymentData = (cartTotal, pfData) => {
        return Math.abs(parseFloat(cartTotal) - parseFloat(pfData.amount_gross)) <= 0.01;
    };

    const pfValidServerConfirmation = async (pfHost, pfParamString) => {
        
        const result = await axios.post(`https://${pfHost}/eng/query/validate`, pfParamString)
            .then((res) => {
                console.log("validserver",res.data)
                return res.data;
            })
            .catch((error) => {
                console.error(error)
            });
        return result === 'VALID';
    };

    const pass_phrase = "FAKEHOTEL1995-12"
    const check1 = pfValidSignature(payFastData, pfParamString,pass_phrase);
    const check2 = pfValidIP(request, pass_phrase);
    const check3 = pfValidPaymentData(sale_info.amount, payFastData);
    const check4 = pfValidServerConfirmation(pfHost, pfParamString);

    if (check1 && check2 && check3 && check4) {
        // All checks have passed, the payment is successful
        console.log("payment complete")
        pay_status={status:"SUCCESSFUL"}
    } else {
        // Some checks have failed, check payment manually and log for investigation
        console.log("payment failed")
       pay_status={status:"FAILED"}
    }

})

router.get('/status',(request,response)=>{
    response.send(pay_status)

    pay_status = {status:"FAILED"}
})

router.post('/cancel_url', (request, response) => {//get is a request fuction from client
    let c = request.body
    console.log("cancel", c)
})

router.post('/pay', async (request, response) => {//get is a request fuction from client
    let user_info = request.body
    // Merchant details
    let merchant_info = {
        merchant_id: "10011926",
        merchant_key: "m69a134j9vtdg",
        return_url: " https://kindly-amazed-collie.ngrok-free.app",
        cancel_url: " https://kindly-amazed-collie.ngrok-free.app/api/cancel_url",
        notify_url: " https://kindly-amazed-collie.ngrok-free.app/api/notify_url"
    };
    sale_info = { ...merchant_info, ...user_info }



    const host = 'https://sandbox.payfast.co.za​/eng/process'

    const generateSignature = (data, passPhrase = null) => {
        // Create parameter string
        let pfOutput = "";
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] !== "") {
                    pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`
                }
            }
        }

        // Remove last ampersand
        let getString = pfOutput.slice(0, -1);
        if (passPhrase !== null) {
            getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
        }

        return crypto.createHash("md5").update(getString).digest("hex");
    };

    const pass_phrase = "FAKEHOTEL1995-12"
    const signature = generateSignature(sale_info, pass_phrase)
    sale_info = { ...sale_info, signature: signature }


    axios.post(host, sale_info)
        .then((res) => {
            response.send({ redirectUrl: res.request.res.responseUrl })
        })
        .catch((error) => {
            response.send({ redirectUrl: error.request.res.responseUrl })
        });


})

router.post('/popuppay', async (request, response) => {//get is a request fuction from client
    let user_info = request.body
    // Merchant details
    let merchant_info = {
        merchant_id: "10011926",
        merchant_key: "m69a134j9vtdg",
        return_url: " https://kindly-amazed-collie.ngrok-free.app",
        cancel_url: " https://kindly-amazed-collie.ngrok-free.app/api/cancel_url",
        notify_url: " https://kindly-amazed-collie.ngrok-free.app/api/notify_url"
    };
    sale_info = { ...merchant_info, ...user_info }
    delete sale_info.cell_number


    const host = 'https://sandbox.payfast.co.za​/onsite/process'


    const dataToString = (dataArray) => {
        console.log('dataArray',dataArray)
        // Convert your data array to a string
        let pfParamString = "";
        for (let key in dataArray) {
            if(dataArray.hasOwnProperty(key)){
                pfParamString +=`${key}=${encodeURIComponent(dataArray[key].trim()).replace(/%20/g, "+")}&`;
            }
        }
        console.log("POPUP-datatostring",pfParamString)
        // Remove last ampersand
        return pfParamString.slice(0, -1);
      };

    const generateSignature = (data, passPhrase = null) => {
        // Create parameter string
        let pfOutput = "";
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                if (data[key] !== "") {
                    pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`
                }
            }
        }

        // Remove last ampersand
        let getString = pfOutput.slice(0, -1);
        if (passPhrase !== null) {
            getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
        }

        return crypto.createHash("md5").update(getString).digest("hex");
    };

    const generatePaymentIdentifier = async (pfParamString) => {
        console.log("host",host)
        const result = await axios.post(host, pfParamString)
            .then((res) => {
                console.log('pop axios',res)
              return res.data;
            })
            .catch((error) => {
              console.error(error)
            });
     
        return result;
      };

    const pass_phrase = "FAKEHOTEL1995-12"
    const signature = generateSignature(sale_info, pass_phrase)
    sale_info = { ...sale_info, signature: signature }
    
    const stringed_data = dataToString(sale_info)

    const data = await generatePaymentIdentifier(stringed_data)

    console.log("stringed data", stringed_data,"uuid",data);

    response.json(data)
})

// //CRUD functions for Posts

// //get all
// router.get('/users', (request,response)=>{//get is a request fuction from client
//     response.json(users.users)//response to client, in json
// })


// //get one user
// router.get('/users/:id',(request,response)=>{//get is a request fuction from client
//     const id = parseInt(request.params.id)
//     response.json(users.users.find((user)=>user.id===id))//response to client, in json
// })


// //post a new user
// router.post('/users',(request,response)=>{//get is a request fuction from client
//     let user = request.body as User
//     user.id = users.users!.length+1

//     if(user){
//         // users.users.push(user)
//         response.json(user)//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.
//     }else{
//         response.json({message:"user not created"})
//     }
// })

// //update a user
// router.put('/users/:id',(request,response)=>{//get is a request fuction from client
//     let user = request.body as User
//     let id = parseInt(request.params.id)

//         // const userToUpdate = users.users.find((user)=>user.id===id)
//         if(user){

//             // userToUpdate.email = user.email
//             // userToUpdate.firstName = user.firstName
//             // userToUpdate.lastName = user.lastName
//             // userToUpdate.password = user.password
//             // userToUpdate.phone = user.phone

//             // users.users.map(
//             //     (user)=>user.id===id?({...user,userToUpdate}):(user)
//             // )
//             response.json(user)//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.

//         }else{
//             response.json({message:"user was not found"})
//         }


// })


// //delete a user
// router.delete('/users/:id',(request,response)=>{//get is a request fuction from client
//     let user = request.body as User
//     let id = parseInt(request.params.id)
//     if(user){
//         const userToDelete = users.users.find((user)=>user.id === id)
//         if(userToDelete){
//             // const newList =users.users.filter((user)=>user.id !== id)

//             // users.users = newList

//             response.json(userToDelete)//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.

//         }else{
//             response.json({message:"user was not found"})
//         }

//     }
// })




// //CRUD functions for Todos

// //get all todos
// router.get('/todos',(request,response)=>{//get is a request fuction from client
//     response.json(todos.todos)//response to client, in json
// })

// //get one todo
// router.get('/todos/:id',(request,response)=>{//get is a request fuction from client
//     let id = parseInt(request.params.id)
//     response.json(todos.todos.find((todo)=>todo.id===id))//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.
// })

// //post a new todo
// router.post('/todos',(request,response)=>{//get is a request fuction from client
//     let todo = request.body as Todo
//     if(todo){
//         // todo.id = todos.todos.length+1
//         // todos.todos.push(todo)
//         response.json(todo)//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.
//     }else{
//         response.json({message:"todo was not created"})
//     }
// })


// //edit todo
// router.put('/todos/:id',(request,response)=>{//get is a request fuction from client
//     let todo = request.body as Todo
//     let id = parseInt(request.params.id)

//         const todoToUpdate = todos.todos.find((todo)=>todo.id===id)
//         if(todo){
//             // todoToUpdate.id = id
//             // todoToUpdate.todo =todo.todo
//             // todoToUpdate.priority =todo.priority
//             // todoToUpdate.priorityColor =todo.priorityColor
//             // todoToUpdate.dueDate =todo.dueDate
//             // todoToUpdate.completed =todo.completed

//             // todos.todos.map((todo)=>todo.id===id?({...todo,todoToUpdate}):todo)
//             response.json(todo)//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.

//         }else{
//             response.json({message:"todo was not found"})
//         }


// })


// //delete todo
// router.delete('/todos/:id',(request,response)=>{//get is a request fuction from client
//     let user = request.body as Todo
//     let id = parseInt(request.params.id)


//     if(user){
//         const userToDelete = todos.todos.find((user)=>user.id === id)
//         if(userToDelete){
//             // const newList =todos.todos.filter((user)=>user.id !== id)

//             // todos.todos = newList

//             response.json(userToDelete)//201 'Created' - Indicates that the request has succeeded and a new resource has been created as a result.

//         }else{
//             response.json({message:"todo was not deleted"})
//         }

//     }
// })




export default router;