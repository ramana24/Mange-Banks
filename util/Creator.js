/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/cash/bankmaster/manage/util/Validator","sap/m/MessageBox"],function(V,M){"use strict";return{_createData:function(t,p,c,C){var d=$.Deferred();t.getView().getModel().create(p,jQuery.extend(false,{},t.dataObject),{success:function(D,r){if(r.headers["sap-message"]){var a=JSON.parse(r.headers["sap-message"]);V._setValidatedMessages(t,a);V._setValidatedFields(t);}else{t.byId("messagesIndicator").setVisible(false);}if(D.BpNumber&&D.ContactPersonNumber){t.bpNumber=D.BpNumber;t.contactPersonNumber=D.ContactPersonNumber;}if(t.getView().getViewName()==="fin.cash.bankmaster.manage.view.Bank"){t.bankInternalId=D.BankInternalId;}sap.m.MessageToast.show(c);t.saveSuccess=true;d.resolve(t.saveSuccess);},error:function(e){if(e.responseText){var r=JSON.parse(e.responseText);V._setValidatedMessages(t,r.error.innererror.errordetails);V._setValidatedFields(t);}sap.m.MessageToast.show(C);d.resolve("error");},});return d.promise();}};});
