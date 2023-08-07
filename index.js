'use strict';
const utilService = require('./routes/util');
const authService = require('./routes/auth');
const adminService = require('./routes/admin');
const vendorService = require('./routes/vendor');
const enquiryService = require('./routes/enquiry');
const categoryService = require('./routes/service');

exports.handler = async (event) => {
    console.log(`Request Event: ${JSON.stringify(event)}`);
    let response;
    try {
        switch (true) {
            case event.path === '/health':
                response = utilService.buildResponse(200, { status: 'success', message: 'NAC Vendor Backend Service Running Successfully' });
                break;
            case event.path === '/login':
                response = await authService.login(JSON.parse(event.body));
                break;
            case event.path === '/verify':
                response = await authService.verify(JSON.parse(event.body));
                break;
            case event.path === '/forgot_password':
                response = await authService.forgot_password(JSON.parse(event.body));
                break;
            case event.path === '/change_password':
                response = await authService.change_password(JSON.parse(event.body));
                break;
            case event.path === '/list_admin':
                response = await adminService.listAdminData(JSON.parse(event.body));
                break;
            case event.path === '/get_admin':
                response = await adminService.getAdminData(JSON.parse(event.body));
                break;
            case event.path === '/add_admin':
                response = await adminService.setAdminData(JSON.parse(event.body));
                break;
            case event.path === '/edit_admin':
                response = await adminService.setAdminData(JSON.parse(event.body));
                break;
            case event.path === '/delete_admin':
                response = await adminService.deleteAdminData(JSON.parse(event.body));
                break;
            case event.path === '/list_vendor':
                response = await vendorService.listVendorData(JSON.parse(event.body));
                break;
            case event.path === '/get_vendor':
                response = await vendorService.getVendorData(JSON.parse(event.body));
                break;
            case event.path === '/add_vendor':
                response = await vendorService.setVendorData(JSON.parse(event.body));
                break;
            case event.path === '/edit_vendor':
                response = await vendorService.setVendorData(JSON.parse(event.body));
                break;
            case event.path === '/delete_vendor':
                response = await vendorService.deleteVendorData(JSON.parse(event.body));
                break;
            case event.path === '/list_enquiry':
                response = await enquiryService.listEnquiryData(JSON.parse(event.body));
                break;
            case event.path === '/get_enquiry':
                response = await enquiryService.getEnquiryData(JSON.parse(event.body));
                break;
            case event.path === '/add_enquiry':
                response = await enquiryService.setEnquiryData(JSON.parse(event.body));
                break;
            case event.path === '/edit_enquiry':
                response = await enquiryService.setEnquiryData(JSON.parse(event.body));
                break;
            case event.path === '/delete_enquiry':
                response = await enquiryService.deleteEnquiryData(JSON.parse(event.body));
                break;
            case event.path === '/list_service':
                response = await categoryService.listServiceData(JSON.parse(event.body));
                break;
            case event.path === '/get_service':
                response = await categoryService.getServiceData(JSON.parse(event.body));
                break;
            case event.path === '/add_service':
                response = await categoryService.setServiceData(JSON.parse(event.body));
                break;
            case event.path === '/edit_service':
                response = await categoryService.setServiceData(JSON.parse(event.body));
                break;
            case event.path === '/delete_service':
                response = await categoryService.deleteServiceData(JSON.parse(event.body));
                break;
            default:
                response = utilService.buildResponse(404, { status: 'failure', message: 'Method not found in NAC Vendor Backend Service' });
        }
    } catch (error) { response = utilService.buildResponse(503, { status: 'error', message: 'Error in running NAC Vendor Backend Service' }); }
    return response;
};