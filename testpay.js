
//created in cmd by typing 'type NUL > index.js'
//insert "type":"module" in package.json in order to use imports
import express from 'express';
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url';
import api_routes from './routes/api_routes.js'


const PORT = 8080;
const app = express();


const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory


app.use(cors())
app.use(express.static(path.join(__dirname,"public")))


app.use("/api",api_routes);

app.get("/",(req,res)=>{
    console.log("return page",req.body)
    const index = path.join(__dirname,'public','test.html')

    res.sendFile(index)
})

// app.post("/pay",(req,res)=>{
//     console.log("hey")
// console.log(req.body)
// res.send(JSON.stringify(req))

// //     const myData = [];
// //     // Merchant details
// //     myData["merchant_id"] = "10000100";
// //     myData["merchant_key"] = "46f0cd694581a";
// //     myData["return_url"] = "http://www.yourdomain.co.za/return_url";
// //     myData["cancel_url"] = "http://www.yourdomain.co.za/cancel_url";
// //     myData["notify_url"] = "http://www.yourdomain.co.za/notify_url";
// //     // Buyer details
// //     myData["name_first"] = "First Name";
// //     myData["name_last"] = "Last Name";
// //     myData["email_address"] = "test@test.com";
// //     // Transaction details
// //     myData["m_payment_id"] = "1234";
// //     myData["amount"] = "10.00";
// //     myData["item_name"] = "Order#123";
// //         // Generate signature
// //     const myPassphrase = "jt7NOE43FZPn";
// //     myData["signature"] = generateSignature(myData, myPassphrase);

// // let htmlForm = `<form action="https://${pfHost}/eng/process" method="post">`;
// // for (let key in myData) {
// //   if(myData.hasOwnProperty(key)){
// //     value = myData[key];
// //     if (value !== "") {
// //       htmlForm +=`<input name="${key}" type="hidden" value="${value.trim()}" />`;
// //     }
// //   }
// // }

// // htmlForm += '<input type="submit" value="Pay Now" /></form>'; 
// });



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
