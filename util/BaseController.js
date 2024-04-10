/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/fin/central/lib/nav/NavigationHandler"],function(C,N){"use strict";return C.extend("fin.cash.bankmaster.manage.util.BaseController",{onInit:function(){this.oNavigationHandler=new N(this);},refresh:{bankTable:false},getEventBus:function(){return this.getOwnerComponent().getEventBus();},getRouter:function(){return sap.ui.core.UIComponent.getRouterFor(this);},getModel:function(n){return this.getView().getModel(n);},setModel:function(m,n){return this.getView().setModel(m,n);},getResourceBundle:function(){return this.getOwnerComponent().getModel("i18n").getResourceBundle();},getText:function(i,p){return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(i,p);},onShareEmailPress:function(){var s=new sap.ui.model.json.JSONModel({emailSubject:this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SEND_EMAIL_SUBJECT")});sap.m.URLHelper.triggerEmail(null,s.getProperty("/emailSubject"),document.URL);},onShareButtonPressed:function(e){if(!this.oShareActionSheet){this.oShareActionSheet=sap.ui.xmlfragment(this.getView().getId(),"fin.cash.bankmaster.manage.fragment.shareActionSheet",this);this.getView().addDependent(this.oShareActionSheet);}this.oShareActionSheet.setModel(this.getView().getModel("i18n"),"i18n");this.oShareActionSheet.openBy(e.getSource());},storeCurrentAppState:function(){},onShareInJamPress:function(){var v=new sap.ui.model.json.JSONModel({jamTitle:this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SHARE_IN_JAM_TITLE")});var s=sap.ui.getCore().createComponent({name:"sap.collaboration.components.fiori.sharing.dialog",settings:{object:{id:document.URL,share:v.getProperty("/jamTitle")}}});s.open();},refreshBinding:function(c){var f=function(d){if((!c.version||c.version!=="basic")&&c.byId("fin.cash.bankmaster.manage.bpNumberLink")){if(d.getObject().BpNumber){c.byId("fin.cash.bankmaster.manage.bpNumberLink").setVisible(true);}else{c.byId("fin.cash.bankmaster.manage.bpNumberLink").setVisible(false);}}};var b=c.getView().getBindingContext();if(b){c.getModel().createBindingContext(b.getPath(),b,null,f,true);}},getService:function(){var s=sap.ushell&&sap.ushell.ui5service&&sap.ushell.ui5service.getService("ShellUIService");},onBeforePopoverOpens:function(e){var p=e.getParameters();var s=p.semanticObject;var S=p.semanticAttributesOfSemanticObjects;var n={};switch(s){case'CompanyCode':n.CompanyCode=S.CompanyCode.CompanyCode;break;case"HouseBank":n.CompanyCode=S.HouseBank.CompanyCode;n.HouseBank=S.HouseBank.HouseBank;break;case"Bank":n.BankCountry=S.Bank.BankCountry;n.Bank=S.Bank.Bank;break;case"BusinessPartner":n.BusinessPartner=S.BusinessPartner.BusinessPartner;break;}e.getParameters().setSemanticAttributes(n,s);e.getParameters().open();}});});