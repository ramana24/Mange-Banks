/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/routing/History","sap/ui/core/routing/HashChanger"],function(H,a){"use strict";return{_navigateBack:function(t){var c=a.getInstance().getHash();var p=H.getInstance().getPreviousHash();if(p!==undefined||p){window.history.go(-1);t.byId("messagesIndicator").setVisible(false);}else if(c!==""&&p===undefined){window.history.go(-1);}else if(c!==""){t.getRouter().navTo("fullScreen",{},true);}else{var C=sap.ushell&&sap.ushell.Container&&sap.ushell.Container.getService("CrossApplicationNavigation");var o=t.getOwnerComponent();if(C){if(C.toExternal){C.toExternal({target:{shellHash:"#"}},o);}}}}};});
