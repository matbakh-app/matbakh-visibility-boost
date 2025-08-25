function handler(event) {
  var req = event.request;
  var host = (req.headers && req.headers.host && req.headers.host.value) || '';
  if (host.toLowerCase() === 'www.matbakh.app') {
    var q = '';
    var params = req.querystring || {};
    for (var key in params) {
      var part = params[key];
      if (!part) continue;
      if (part.multiValue && part.multiValue.length) {
        for (var i=0;i<part.multiValue.length;i++) {
          q += (q ? '&' : '?') + encodeURIComponent(key) + '=' + encodeURIComponent(part.multiValue[i].value);
        }
      } else if (part.value) {
        q += (q ? '&' : '?') + encodeURIComponent(key) + '=' + encodeURIComponent(part.value);
      }
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://matbakh.app' + (req.uri || '/') + q },
        'cache-control': { value: 'max-age=3600' }
      }
    };
  }
  return req;
}
