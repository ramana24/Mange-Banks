/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/cash/bankmaster/manage/util/BaseController","sap/ui/model/json/JSONModel"],function(B,J){"use strict";return B.extend("fin.cash.bankmaster.manage.controller.App",{onInit:function(){var v,s,o=this.getView().getBusyIndicatorDelay();v=new J({async:true,busy:true,delay:0});this.setModel(v,"view");s=function(){v.setProperty("/busy",false);v.setProperty("/delay",o);};this.getOwnerComponent().getModel().metadataLoaded().then(s);}});});
