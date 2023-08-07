const axios = require('axios');

async function sendMessage(data) {
    const { mobile_number, message } = data;
    const response = await axios.post('https://staging.stylori.com/nac_api/send_sms', { sender_id: 'NACJWL', mobile_no: mobile_number, msg_txt: message });
    console.log(response);
}

module.exports = { sendMessage };