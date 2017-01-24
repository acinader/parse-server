const LoggerController = require('../src/Controllers/LoggerController').LoggerController;
const WinstonLoggerAdapter = require('../src/Adapters/Logger/WinstonLoggerAdapter').WinstonLoggerAdapter;
const GridStoreAdapter = require("../src/Adapters/Files/GridStoreAdapter").GridStoreAdapter;
const Config = require("../src/Config");
const FilesController = require('../src/Controllers/FilesController').default;

const mockAdapter = {
  createFile: () => {
    return Parse.Promise.reject(new Error('it failed'));
  },
  deleteFile: () => { },
  getFileData: () => { },
  getFileLocation: () => 'xyz'
}

// Small additional tests to improve overall coverage
describe("FilesController",() =>{
  it("should properly expand objects", (done) => {

    var config = new Config(Parse.applicationId);
    var gridStoreAdapter = new GridStoreAdapter('mongodb://localhost:27017/parse');
    var filesController = new FilesController(gridStoreAdapter)
    var result = filesController.expandFilesInObject(config, function(){});

    expect(result).toBeUndefined();

    var fullFile = {
      type: '__type',
      url: "http://an.url"
    }

    var anObject = {
      aFile: fullFile
    }
    filesController.expandFilesInObject(config, anObject);
    expect(anObject.aFile.url).toEqual("http://an.url");

    done();
  });

  it('should create a server log on failure', done => {
    const logController = new LoggerController(new WinstonLoggerAdapter());

    reconfigureServer({ filesAdapter: mockAdapter })
      .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
      .then(() => new Parse.File("yolo.txt", [1,2,3], "text/plain").save())
      .then(
        () => done.fail('should not succeed'),
        () => setImmediate(() => Parse.Promise.as('done'))
      )
      .then(() => logController.getLogs({ from: Date.now() - 500, size: 1000 }))
      .then((logs) => {
        const log = logs.pop();
        expect(log.level).toBe('error');
        expect(log.code).toBe(130);
        expect(log.message).toBe('Could not store file.');
        done();
      });
  });
});
