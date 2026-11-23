/* Couche d'accès à la base privée (D1) : même interface que la base de claude.ai. */
(function () {
  var API = "/api/admin";
  var subs = {}; // collection -> [{cb, err}]
  var timers = {};
  function call(method, qs, body) {
    var o = { method: method, credentials: "same-origin", headers: { "X-Wayle": "1" } };
    if (body !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body); }
    return fetch(API + "?" + qs, o).then(function (r) {
      if (!r.ok) { var e = new Error("http " + r.status); e.status = r.status; e.code = r.status === 401 || r.status === 403 ? "not_granted" : "http_" + r.status; throw e; }
      return r.json();
    });
  }
  function snap(rows) {
    return { docs: rows.map(function (r) { return { id: r.id, data: function () { return r.data; } }; }) };
  }
  function refresh(coll) {
    return call("GET", "c=" + encodeURIComponent(coll)).then(function (rows) {
      (subs[coll] || []).forEach(function (s) { s.cb(s.single ? singleSnap(rows, s.single) : snap(rows)); });
    }).catch(function (e) { (subs[coll] || []).forEach(function (s) { if (s.err) s.err(e); }); });
  }
  function singleSnap(rows, id) {
    var r = rows.filter(function (x) { return x.id === id; })[0];
    return { exists: !!r, id: id, data: function () { return r ? r.data : {}; } };
  }
  function listen(coll, entry) {
    (subs[coll] = subs[coll] || []).push(entry);
    refresh(coll);
    if (!timers[coll]) timers[coll] = setInterval(function () { if (!document.hidden) refresh(coll); }, 20000);
  }
  function newId() {
    var a = new Uint8Array(9); crypto.getRandomValues(a);
    return "x" + Array.prototype.map.call(a, function (b) { return b.toString(36).padStart(2, "0"); }).join("").slice(0, 14);
  }
  function docRef(coll, id) {
    id = id || newId();
    function done(p) { return p.then(function (r) { refresh(coll); return r; }); }
    return {
      id: id,
      set: function (data) { return done(call("PUT", "c=" + encodeURIComponent(coll) + "&id=" + encodeURIComponent(id), clean(data))); },
      update: function (p) { return done(call("PATCH", "c=" + encodeURIComponent(coll) + "&id=" + encodeURIComponent(id), clean(p))); },
      delete: function () { return done(call("DELETE", "c=" + encodeURIComponent(coll) + "&id=" + encodeURIComponent(id))); },
      onSnapshot: function (cb, err) { listen(coll, { cb: cb, err: err, single: id }); }
    };
  }
  function clean(o) { return JSON.parse(JSON.stringify(o, function (k, v) { return v === undefined ? null : v; })); }
  window.WayleDB = {
    collection: function (coll) {
      return {
        doc: function (id) { return docRef(coll, id); },
        onSnapshot: function (cb, err) { listen(coll, { cb: cb, err: err }); }
      };
    },
    doc: function (path) { var p = path.split("/"); return docRef(p[0], p[1]); }
  };
})();
