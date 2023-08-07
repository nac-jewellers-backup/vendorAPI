'use strict';
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-2';
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const jwtService = require('./jwt');
const utilService = require('./util');
const adminTable = 'nac_cms_admin';

async function listAdminData(data) {
    try {
        const { session } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const result = [];
        const { Items } = await dynamodb.scan({ TableName: adminTable }).promise();
        for (let i = 0; i < Items.length; i++) {
            result.push({
                id: Items[i].id,
                name: Items[i].name,
                mobile: Items[i].mobile_number,
                email: Items[i].email,
                role: Items[i].admin_role,
                status: Items[i].job_status,
                createdOn: Items[i].createdOn
            });
        }
        return utilService.buildResponse(200, { status: 'success', message: 'Admins found', result: result });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function getAdminData(data) {
    try {
        const { session, id } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { Item } = await dynamodb.get({ TableName: adminTable, Key: { id: id } }).promise();
        const result = {
            id: Item.id,
            name: Item.name,
            mobile: Item.mobile_number,
            email: Item.email,
            role: Item.admin_role,
            status: Item.job_status,
            createdOn: Item.createdOn
        };
        return utilService.buildResponse(200, { status: 'success', message: 'Admin found', result: result });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function setAdminData(data) {
    try {
        const { session, admin } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { id, name, mobile, email, password, role, status, createdOn, type } = admin;
        const checkInfo = await checkAdminDetails({ id, email, mobile, type });
        if (checkInfo === 'error') { return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' }); }
        if (checkInfo !== 'success') { return utilService.buildResponse(202, { status: 'failure', message: checkInfo }); }
        const encryptedPWD = bcrypt.hashSync(password.trim(), 10);
        const adminDetails = { id: id, name: name.trim(), mobile_number: mobile.trim(), email: email.trim(), password: encryptedPWD, admin_role: role, job_status: status, createdOn: createdOn };
        const response = (type === 'add') ? await saveAdmin(adminDetails) : await updateAdmin(adminDetails);
        if (!response) { return utilService.buildResponse(200, { status: 'failure', message: (type === 'add') ? 'Error in adding admin' : 'Error in editing admin' }); }
        return utilService.buildResponse(200, { status: 'success', message: (type === 'add') ? 'Admin record added sucessfully' : 'Admin record edited sucessfully' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function deleteAdminData(data) {
    try {
        const { session, id } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const params = { TableName: adminTable, Key: { id: id }, ReturnValues: 'ALL_OLD' };
        await dynamodb.delete(params).promise();
        return utilService.buildResponse(200, { status: 'success', message: 'Admin record deleted sucessfully' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function checkAdminDetails(data) {
    try {
        const { id, email, mobile, type } = data;
        const { Items } = await dynamodb.scan({ TableName: adminTable }).promise();
        for (let i = 0; i < Items.length; i++) {
            if (type === 'add') {
                if (Items[i].email === email) { return 'EMail Address already exists'; }
                if (Items[i].mobile_number === mobile) { return 'Mobile Number already exists'; }
            } else {
                if (Items[i].email === email && Items[i].id !== id) { return 'EMail Address already exists'; }
                if (Items[i].mobile_number === mobile && Items[i].id !== id) { return 'Mobile Number already exists'; }
            }
        }
        return 'success';
    } catch (error) {
        console.log(error);
        return 'error';
    }
}

async function saveAdmin(data) {
    try {
        const params = { TableName: adminTable, Item: data };
        const response = dynamodb.put(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                return false;
            } else {
                console.log("Success", data);
                return true;
            }
        });
        return response;
    } catch (error) {
        console.log(error);
        return false;
    }
}

async function updateAdmin(data) {
    try {
        const id = data.id;
        delete data.id;
        delete data.password;
        delete data.createdOn;

        const objectKeys = Object.keys(data);
        const params = {
            TableName: adminTable,
            Key: { id: id },
            UpdateExpression: `SET ${objectKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
            ExpressionAttributeNames: objectKeys.reduce((acc, key, index) => ({ ...acc, [`#key${index}`]: key }), {}),
            ExpressionAttributeValues: objectKeys.reduce((acc, key, index) => ({ ...acc, [`:value${index}`]: data[key] }), {})
        };
        const response = dynamodb.update(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                return false;
            } else {
                console.log("Success", data);
                return true;
            }
        });
        console.log(response);
        return response;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports = { listAdminData, getAdminData, setAdminData, deleteAdminData };