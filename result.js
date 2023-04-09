let {nodeHeight} = require('./node');
let {regexToHash} = require('./regex');

nodeHeight(regexToHash('.....')).then(console.log);

