var MyVars = {
    keepTrying: true
};


function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

$(document).ready(function () {

    // Get the tokens
    get3LegToken(function(token) {

        if (!token) {
            signIn();
        } else {
            MyVars.token3Leg = token;

            var urn = GetURLParameter('urn');
            initializeViewer(urn);
        }
    });
});


function signIn() {
    $.ajax({
        url: '/user/authenticate',
        success: function (rootUrl) {
            location.href = rootUrl;
        }
    });
}

function get3LegToken(callback) {

    if (callback) {
        $.ajax({
            url: '/user/refreshedtoken',
            success: function (data) {
                MyVars.token3Leg = data.token;
                console.log('Returning new 3 legged token (User Authorization): ' + MyVars.token3Leg);
                callback(data.token, data.expires_in);
            }
        });
    } else {
        console.log('Returning saved 3 legged token (User Authorization): ' + MyVars.token3Leg);

        return MyVars.token3Leg;
    }
}

/////////////////////////////////////////////////////////////////
// Viewer
// Based on Autodesk Viewer basic sample
// https://developer.autodesk.com/api/viewerapi/
/////////////////////////////////////////////////////////////////

function cleanupViewer() {
    // Clean up previous instance
    if (MyVars.viewer && MyVars.viewer.model) {
        console.log("Unloading current model from Autodesk Viewer");

        MyVars.viewer.impl.unloadModel(MyVars.viewer.model);
        MyVars.viewer.impl.sceneUpdated(true);
    }
}

function initializeViewer(urn) {
    cleanupViewer();

    console.log("Launching Autodesk Viewer for: " + urn);

    var options = {
        document: 'urn:' + urn,
        env: 'AutodeskProduction',
        extensions: ['Autodesk.Viewing.WebVR'],
        experimental: ['webVR_orbitModel'],
        getAccessToken: get3LegToken // this works fine, but if I pass get3LegToken it only works the first time
    };

    if (MyVars.viewer) {
        loadDocument(MyVars.viewer, options.document);
    } else {
        var viewerElement = document.getElementById('forgeViewer');
        MyVars.viewer = new Autodesk.Viewing.Private.GuiViewer3D(viewerElement, {});
        Autodesk.Viewing.Initializer(
            options,
            function () {
                MyVars.viewer.start(); // this would be needed if we also want to load extensions
                loadDocument(MyVars.viewer, options.document);
            }
        );
    }
}

function loadDocument(viewer, documentId) {
    // Set the Environment to "Riverbank"
    viewer.setLightPreset(8);

    // Make sure that the loaded document's setting won't
    // override it and change it to something else
    viewer.prefs.tag('ignore-producer');

    Autodesk.Viewing.Document.load(
        documentId,
        // onLoad
        function (doc) {
            var geometryItems = [];
            // Try 3d geometry first
            geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
                'type': 'geometry',
                'role': '3d'
            }, true);

            // If no 3d then try 2d
            if (geometryItems.length < 1)
                geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), {
                    'type': 'geometry',
                    'role': '2d'
                }, true);

            if (geometryItems.length > 0) {
                var path = doc.getViewablePath(geometryItems[0]);
                //viewer.load(doc.getViewablePath(geometryItems[0]), null, null, null, doc.acmSessionId /*session for DM*/);
                var options = {};
                viewer.loadModel(path, options);
            }
        },
        // onError
        function (errorMsg) {
            //showThumbnail(documentId.substr(4, documentId.length - 1));
        }
    )
}




