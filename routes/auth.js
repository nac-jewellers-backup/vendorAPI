'use strict'
const axios = require('axios');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' });
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const jwtService = require('./jwt');
const utilService = require('./util');

async function login(data) {
    try {
        const { tableName, mobile_number, password } = data;
        if (!data || !mobile_number || !password) { return utilService.buildResponse(401, { status: 'failure', message: 'Mobile number and Password are required' }); }
        const dynamoUser = await getUser({ tableName, mobile_number });
        if (!dynamoUser || !dynamoUser.mobile_number) { return utilService.buildResponse(403, { status: 'failure', message: 'Invalid credentials' }); }
        if (!bcrypt.compareSync(password, dynamoUser.password)) { return utilService.buildResponse(403, { status: 'failure', message: 'Invalid credentials' }); }
        const userInfo = { mobile_number: dynamoUser.mobile_number };
        const token = jwtService.generateToken(userInfo);
        return utilService.buildResponse(200, { status: 'success', session: { user: userInfo, token: token }, name: dynamoUser.name });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Login service error' });
    }
}

async function getUser(data) {
    const { tableName, mobile_number } = data;
    const params = {
        TableName: tableName,
        FilterExpression: '#mobile_number = :mobile_number',
        ExpressionAttributeNames: { '#mobile_number': 'mobile_number' },
        ExpressionAttributeValues: { ':mobile_number': mobile_number }
    };
    return await dynamodb.scan(params).promise().then(response => {
        return response.Items[0];
    }, error => { console.error('There is an error getting user: ', error); });
}

async function forgot_password(data) {
    const result = await changePassword(data);
    if (result === false) { return utilService.buildResponse(401, { status: 'error', message: 'Error in changing the password' }); }
    return utilService.buildResponse(200, { status: 'success', message: 'Password successfully changed' });
}

async function verify(data) {
    try {
        const { tableName, mobile_number } = data;
        const dynamoUser = await getUser({ tableName, mobile_number });
        if (!dynamoUser || !dynamoUser.mobile_number) { return utilService.buildResponse(401, { status: "failed", message: "User not found" }); }
        const otp = parseInt(Math.floor(1000 + Math.random() * 9000));
        const msg_txt = `Dear ${dynamoUser.name}, Please use this OTP ${otp} to reset the password.`
        const response = await axios.post('https://staging.stylori.com/nac_api/send_sms', { sender_id: 'NACJWL', mobile_no: mobile_number, msg_txt });
        const { status } = response;
        if (status !== 200) { return util.buildResponse(401, { status: "failed", message: "Error in sending OTP" }); }
        return utilService.buildResponse(200, { status: "success", message: "User found", data: { id: dynamoUser.id, name: dynamoUser.name, mobile_number: dynamoUser.mobile_number, otp: otp } });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error' });
    }
}

async function change_password(data) {
    try {
        const { session, request } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { id, old_password, new_password, tableName } = request;
        const { Item } = await dynamodb.get({ TableName: tableName, Key: { id: id } }).promise();
        if (!bcrypt.compareSync(old_password, Item.password)) { return utilService.buildResponse(403, { status: 'failure', message: 'Password is incorrect' }); }
        const result = await changePassword({ id: id, password: new_password, tableName: tableName });
        if (result === false) { return utilService.buildResponse(401, { status: 'failure', message: 'Error in changing password' }); }
        return utilService.buildResponse(200, { status: 'success', message: 'Password successfully changed' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error' });
    }
}

async function changePassword(data) {
    try {
        const { id, password, tableName } = data;
        const new_password = bcrypt.hashSync(password.trim(), 10);
        const params = {
            TableName: tableName,
            Key: { id: id },
            UpdateExpression: 'SET #password = :password',
            ExpressionAttributeNames: { '#password': 'password' },
            ExpressionAttributeValues: { ':password': new_password }
        };
        await dynamodb.update(params).promise();
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = { login, getUser, forgot_password, change_password, verify };