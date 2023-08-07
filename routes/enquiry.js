'use strict';
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-2';
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const jwtService = require('./jwt');
const utilService = require('./util');
const enquiryTable = 'nac_cms_enquiry';

async function listEnquiryData(data) {
    try {
        const { session } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const result = [];
        const { Items } = await dynamodb.scan({ TableName: enquiryTable }).promise();
        for (let i = 0; i < Items.length; i++) {
            result.push({
                id: Items[i].id,
                title: Items[i].title,
                description: Items[i].description,
                enquiry_status: Items[i].enquiry_status,
                deadline_date: Items[i].deadline_date,
                active_status: Items[i].active_status,
                created_date: Items[i].created_date,
                created_by: Items[i].created_by,
                modified_date: Items[i].modified_date,
                modified_by: Items[i].modified_by
            });
        }
        return utilService.buildResponse(200, { status: 'success', message: 'Enquiries found', result: result });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function getEnquiryData(data) {
    try {
        const { session, id } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { Item } = await dynamodb.get({ TableName: enquiryTable, Key: { id: id } }).promise();
        const result = {
            id: Item.id,
            title: Item.title,
            description: Item.description,
            enquiry_status: Item.enquiry_status,
            deadline_date: Item.deadline_date,
            active_status: Item.active_status,
            created_date: Item.created_date,
            created_by: Item.created_by,
            modified_date: Item.modified_date,
            modified_by: Item.modified_by
        };
        return utilService.buildResponse(200, { status: 'success', message: 'Enquiry found', result: result });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function setEnquiryData(data) {
    try {
        const { session, enquiry } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const {type}=enquiry;
        const response = (type === 'add') ? await saveEnquiry(enquiry) : await updateEnquiry(enquiry);
        if (!response) { return utilService.buildResponse(200, { status: 'failure', message: (type === 'add') ? 'Error in adding enquiry' : 'Error in editing enquiry' }); }
        return utilService.buildResponse(200, { status: 'success', message: (type === 'add') ? 'Enquiry record added sucessfully' : 'Enquiry record edited sucessfully' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function deleteEnquiryData(data) {
    try {
        const { session, id } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const params = { TableName: enquiryTable, Key: { id: id }, ReturnValues: 'ALL_OLD' };
        await dynamodb.delete(params).promise();
        return utilService.buildResponse(200, { status: 'success', message: 'Enquiry record deleted sucessfully' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function saveEnquiry(data) {
    try {
        const params = { TableName: enquiryTable, Item: data };
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

async function updateEnquiry(data) {
    try {
        const id = data.id;
        delete data.id;
        delete data.created_date;
        delete data.created_by;

        const objectKeys = Object.keys(data);
        const params = {
            TableName: enquiryTable,
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

module.exports = { listEnquiryData, getEnquiryData, setEnquiryData, deleteEnquiryData };