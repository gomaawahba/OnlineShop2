const mongoose = require("mongoose");

let connect = async function connectdb() {
    try {
        await mongoose.connect(process.env.MONGO_URL_atlas)
        console.log(`connction mongo db`)
    } catch (error) {
        console.log((error))
    }

};
module.exports = {
        connect
    }
    //"mongodb+srv://gomaawahba3:GOMAA_g1o2m3a4a5@cluster0.ivm2xu4.mongodb.net/onlineShope"
    // mongoose.connect(process.env.MONGO_URL)
    //     .then(() => console.log(`connction mongo db`))
    //     .catch((error) => console.log(error));