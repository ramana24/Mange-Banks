/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],function(){"use strict";return{_toggleElements:function(t){if(t.byId("_IDEGen_fragment0--toggleElementsLink").getText()===t.getText("SHOW_ALL_FIELDS")){t.byId("_IDEGen_fragment0--toggleElementsLink").setText(t.getText("SHOW_FEWER_FIELDS"));t.byId("_IDEGen_fragment0--toggleElementsLink").setTooltip(t.getText("SHOW_FEWER_FIELDS_TOOLTIP"));var s=true;}else{t.byId("_IDEGen_fragment0--toggleElementsLink").setText(t.getText("SHOW_ALL_FIELDS"));t.byId("_IDEGen_fragment0--toggleElementsLink").setTooltip(t.getText("SHOW_ALL_FIELDS_TOOLTIP"));var s=false;}for(var i=1;i<=17;i++){t.byId("_IDEGen_fragment0--element_"+i.toString()).setVisible(s);}}};});
