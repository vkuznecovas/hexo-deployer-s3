var s3 = require('s3');
var chalk = require('chalk');
var xtend = require('xtend');
var path = require('path');

module.exports = function(args) {

  var config = {
    maxAsyncS3: args.concurrency,
    s3Options: {
      accessKeyId: args.aws_key || process.env.AWS_ACCESS_KEY_ID || process.env.AWS_KEY,
      secretAccessKey: args.aws_secret || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET,
      region: args.region
    }
  };
  var client = s3.createClient(config);

  var publicDir = this.config.public_dir;
  var log = this.log;
  logger = this.log
  var customHeaders = args.headers || {
    all: {},
    type_specific: []
  };

  if (!args.bucket || !config.s3Options.accessKeyId || !config.s3Options.secretAccessKey) {
    var help = '';

    help += 'You should configure deployment settings in _config.yml first!\n\n';
    help += 'Example:\n';
    help += '  deploy:\n';
    help += '    type: s3\n';
    help += '    bucket: <bucket>\n';
    help += '    [aws_key]: <aws_key>        # Optional, if provided as environment variable\n';
    help += '    [aws_secret]: <aws_secret>  # Optional, if provided as environment variable\n';
    help += '    [concurrency]: <concurrency>\n';
    help += '    [region]: <region>          # See https://github.com/LearnBoost/knox#region\n',
    help += '    [headers]: <JSON headers>   # Optional, see README.md file\n';
    help += '    [prefix]: <prefix>          # Optional, prefix ending in /\n\n';
    help += 'For more help, you can check the docs: ' + chalk.underline('https://github.com/nt3rp/hexo-deployer-s3');

    console.log(help);
    return;
  }

  var params = {
    localDir: publicDir,
    deleteRemoved: true,
    s3Params: {
      Bucket: args.bucket,
      Prefix: args.prefix,
    },
    getS3Params: (file, stat, callback) => {
      var fileName = path.basename(file);
      var extension = path.extname(fileName).slice(1);
      let headers = customHeaders.all;
      customHeaders.type_specific.forEach(e => {
        if (!e.types || e.types.length === 0) {
          return;
        }
        var index = e.types.indexOf(extension)
        if (index > -1) {
          headers = xtend(headers, e.values || {})
        }
      })
      callback(null, headers || true);
    }
  }
  
  var uploader = client.uploadDir(params);
  log.info('Uploading...');
  return uploader
    .on('progress', function() {
      //   log.info(uploader.progressAmount + ' / ' + uploader.progressTotal);
    }).on('end', function() {
      log.info('Done!');
    }).on('error', function(err) {
      log.error(err)
    });
};
