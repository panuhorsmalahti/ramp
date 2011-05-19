var URL = require("url");
var buster = require("buster-core");
var uuid = require("node-uuid");

var capturedClient = require("./captured-client");

module.exports = {
    captureUrl: "/capture",

    respond: function (req, res) {
        var url = URL.parse(req.url);

        if (url.pathname == this.captureUrl) {
            this.captureClient(req, res);
            return true;
        }

        for (var i = 0, ii = this.capturedClients.length; i < ii; i++) {
            if (this.capturedClients[i].respond(req, res, url.pathname)) return true;
        }
    },

    captureClient: function (req, res) {
        var client = capturedClient.create(uuid(), this.multicastMiddleware);
        this.capturedClients.push(client);

        if (this.currentSession) {
            client.startSession(this.currentSession);
        }

        this.oncapture(req, res, client);
    },

    bindToSessionMiddleware: function (sessionMiddleware) {
        var self = this;
        sessionMiddleware.on("session:start", function (session) {
            self.startSession(session);
        });
        sessionMiddleware.on("session:end", function () {
            self.endSession();
        });
    },

    startSession: function (session) {
        this.currentSession = session;
        for (var i = 0, ii = this.capturedClients.length; i < ii; i++) {
            this.capturedClients[i].startSession(session);
        }
    },

    endSession: function () {
        this.currentSession = null;
        for (var i = 0, ii = this.capturedClients.length; i < ii; i++) {
            this.capturedClients[i].endSession();
        }
    },

    get capturedClients() {
        return this._capturedClients || (this._capturedClients = []);
    }
};