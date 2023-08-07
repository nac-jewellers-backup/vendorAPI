'use strict';
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-2';
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const jwtservice = require('./jwt');
const utilservice = require('./util');
const serviceTable = 'nac_cms_service';

async function listServiceData(data) {
    try {
        const { session } = data;
        if (jwtservice.verify(session) === false) { return utilservice.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const result = [];
        const { Items } = await dynamodb.scan({ TableName: serviceTable }).promise();
        for (let i = 0; i < Items.length; i++) {
            result.push({
                id: Items[i].id,
                service_name: Items[i].service_name
            });
        }
        return utilservice.buildResponse(200, { status: 'success', message: 'Service found', result: result });
    } catch (error) {
        console.log(error);
        return utilservice.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function getServiceData(data) {
    try {
        const { session, id } = data;
        if (jwtservice.verify(session) === false) { return utilservice.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { Item } = await dynamodb.get({ TableName: serviceTable, Key: { id: id } }).promise();
        const result = {
            id: Item.id,
            service_name: Item.service_name
        };
        return utilservice.buildResponse(200, { status: 'success', message: 'Service found', result: result });
    } catch (error) {
        console.log(error);
        return utilservice.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function setServiceData(data) {
    try {
        const { session, service } = data;
        if (jwtservice.verify(session) === false) { return utilservice.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const checkInfo = await checkServiceName(service);
        if (checkInfo === 'error') { return utilservice.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' }); }
        if (checkInfo !== 'success') { return utilservice.buildResponse(202, { status: 'failure', message: checkInfo }); }
        const { type } = service;
        const response = (type === 'add') ? await saveService(service) : await updateService(service);
        if (!response) { return utilservice.buildResponse(200, { status: 'failure', message: (type === 'add') ? 'Error in adding enquiry' : 'Error in editing service' }); }
        return utilservice.buildResponse(200, { status: 'success', message: (type === 'add') ? 'Service record added sucessfully' : 'Service record edited sucessfully' });
    } catch (error) {
        console.log(error);
        return utilservice.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function checkServiceName(data) {
    try {
        const { id, service_name, type } = data;
        const { Items } = await dynamodb.scan({ TableName: serviceTable }).promise();
        for (let i = 0; i < Items.length; i++) {
            if (type === 'add') {
                if (Items[i].service_name === service_name) { return 'service Name already exists'; }
            } else {
                if (Items[i].service_name === service_name && Items[i].id !== id) { return 'Service Name already exists'; }
            }
        }
        return 'success';
    } catch (error) {
        console.log(error);
        return 'error';
    }
}

async function deleteServiceData(data) {
    try {
        const { session, id } = data;
        if (jwtservice.verify(session) === false) { return utilservice.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const params = { TableName: serviceTable, Key: { id: id }, ReturnValues: 'ALL_OLD' };
        await dynamodb.delete(params).promise();
        return utilservice.buildResponse(200, { status: 'success', message: 'Service record deleted sucessfully' });
    } catch (error) {
        console.log(error);
        return utilservice.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function saveService(data) {
    try {
        delete data.type;
        const params = { TableName: serviceTable, Item: data };
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

async function updateService(data) {
    try {
        const id = data.id;
        delete data.id;
        delete data.type;
        const objectKeys = Object.keys(data);

        const params = {
            TableName: serviceTable,
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

module.exports = { listServiceData, getServiceData, setServiceData, deleteServiceData };