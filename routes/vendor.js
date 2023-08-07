'use strict';
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');
AWS.config.region = 'us-east-2';
const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const jwtService = require('./jwt');
const utilService = require('./util');
const vendorTable = 'nac_cms_vendor';

async function listVendorData(data) {
    try {
        const { session } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const result = [];
        const { Items } = await dynamodb.scan({ TableName: vendorTable }).promise();
        for (let i = 0; i < Items.length; i++) {
            result.push({
                id: Items[i].id,
                vendor_name: Items[i].vendor_name,
                shop_mobile: Items[i].mobile_number,
                shop_address: Items[i].shop_address,
                category: Items[i].category,
                email: Items[i].email,
                contact_number: Items[i].contact_number,
                contact_person: Items[i].contact_person,
                pan: Items[i].pan,
                gst_number: Items[i].gst_number,
                fax: Items[i].fax,
                vendor_status: Items[i].vendor_status,
                created_date: Items[i].created_date,
                created_by: Items[i].created_by,
                modified_date: Items[i].modified_date,
                modified_by: Items[i].modified_by
            });
        }
        return utilService.buildResponse(200, { status: 'success', message: 'Vendors found', result: result });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function getVendorData(data) {
    try {
        const { session, id } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { Item } = await dynamodb.get({ TableName: vendorTable, Key: { id: id } }).promise();
        const result = {
            id: Item.id,
            vendor_name: Item.vendor_name,
            shop_mobile: Item.mobile_number,
            shop_address: Item.shop_address,
            category: Item.category,
            email: Item.email,
            contact_number: Item.contact_number,
            contact_person: Item.contact_person,
            pan: Item.pan,
            gst_number: Item.gst_number,
            fax: Item.fax,
            vendor_status: Item.vendor_status,
            created_date: Item.created_date,
            created_by: Item.created_by,
            modified_date: Item.modified_date,
            modified_by: Item.modified_by
        };
        return utilService.buildResponse(200, { status: 'success', message: 'Vendor found', result: result });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'failure', message: 'Server Error. Please try again later' });
    }
}

async function setVendorData(data) {
    try {
        const { session, vendor } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const { id, vendor_name, shop_mobile, vendor_pass, shop_address, category, email, contact_number, contact_person, pan, gst_number, fax, vendor_status, created_date, created_by, modified_date, modified_by, type } = vendor;
        const checkInfo = await checkVendorDetails({ id, email, shop_mobile, type });
        if (checkInfo === 'error') { return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' }); }
        if (checkInfo !== 'success') { return utilService.buildResponse(202, { status: 'failure', message: checkInfo }); }
        const encryptedPWD = bcrypt.hashSync(vendor_pass.trim(), 10);
        const vendorDetails = {
            id: id,
            vendor_name: vendor_name.trim(),
            mobile_number: shop_mobile.trim(),
            email: email.trim(),
            password: encryptedPWD,
            shop_address: shop_address.trim(),
            category: category,
            contact_number: contact_number,
            contact_person: contact_person.trim(),
            pan: pan,
            gst_number: gst_number,
            fax: fax,
            vendor_status: vendor_status,
            created_date: created_date,
            created_by: created_by,
            modified_date: modified_date,
            modified_by: modified_by
        };
        const response = (type === 'add') ? await saveVendor(vendorDetails) : await updateVendor(vendorDetails);
        if (!response) { return utilService.buildResponse(200, { status: 'failure', message: (type === 'add') ? 'Error in adding vendor' : 'Error in editing vendor' }); }
        return utilService.buildResponse(200, { status: 'success', message: (type === 'add') ? 'Vendor record added sucessfully' : 'Vendor record edited sucessfully' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function deleteVendorData(data) {
    try {
        const { session, id } = data;
        if (jwtService.verify(session) === false) { return utilService.buildResponse(403, { status: 'failure', message: 'Unauthorized' }); }
        const params = { TableName: vendorTable, Key: { id: id }, ReturnValues: 'ALL_OLD' };
        await dynamodb.delete(params).promise();
        return utilService.buildResponse(200, { status: 'success', message: 'Vendor record deleted sucessfully' });
    } catch (error) {
        console.log(error);
        return utilService.buildResponse(503, { status: 'error', message: 'Server Error. Please try again later' });
    }
}

async function checkVendorDetails(data) {
    try {
        const { id, email, mobile, type } = data;
        const { Items } = await dynamodb.scan({ TableName: vendorTable }).promise();
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

async function saveVendor(data) {
    try {
        const params = { TableName: vendorTable, Item: data };
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

async function updateVendor(data) {
    try {
        const id = data.id;
        delete data.id;
        delete data.password;
        delete data.created_date;
        delete data.created_by;

        const objectKeys = Object.keys(data);
        const params = {
            TableName: vendorTable,
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

module.exports = { listVendorData, getVendorData, setVendorData, deleteVendorData };