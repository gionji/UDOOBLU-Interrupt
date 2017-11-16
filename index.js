var BluManager = require('udoo-blu');
var async = require('async');
var fs = require('fs');

var bluManager = new BluManager();

var blus = ['b0b448c3d007', '247189cd02483'];

const VIRTUAL_SENSOR_PATH = '/sensor/.../data';

fs.writeFileSync(VIRTUAL_SENSOR_PATH, '');

var virtualSensorChanged = 0;

var tmpBlus = {};

const bluDiscoverCallback = function (blu_per) {
    tmpBlus[blu_per.id] = blu_per;
};

bluManager.on('bluDiscover', bluDiscoverCallback);
bluManager.scan();
console.log("==== START SCAN ====");


function onInterrupt(bluId) {
    console.log(`==== INTERRUPT ON :${bluId} === \n`);
    virtualSensorChanged = virtualSensorChanged === 0 ? 1: 0;
    fs.writeFileSync(VIRTUAL_SENSOR_PATH, `${virtualSensorChanged} , ${bluId}`);
}

setTimeout(function () {
    const keys = Object.keys(tmpBlus);
    const size = keys.length ? keys.length : 0;

    console.log(`\n==== SCAN FINISHED FOUNDS: ${size} ====\n`);

    if (size > 0) {
        keys.filter((udooBlu) => {
            console.log('iiiii ' + udooBlu);
            return blus[udooBlu] !== null;
        }).map((udooBlu) => {
            return tmpBlus[udooBlu]
        }).forEach((udooBlu) => {

            console.log(`==== FOUND- ${udooBlu.id}\n`);
            console.log(`==== TRY CONNECT TO- ${udooBlu.id}\n`);

            connectAndSetInterrupt(udooBlu, true, false, false, 300);
        });
    }
}, 12000);

/**
 *
 * @param udoobludevice UDOO BLU
 * @param enableXAxis   boolean enable interrupt on x Axis
 * @param enableYAxis   boolean enable interrupt on y Axis
 * @param enableZAxis   boolean enable interrupt on z Axis
 * @param threshold     detection threshold ex. 300 => 0.3g
 */

function connectAndSetInterrupt(udoobludevice, enableXAxis, enableYAxis, enableZAxis, threshold) {
    async.series([
        function (callback) {
            udoobludevice.connectAndSetUp(callback);
        },
        function (callback) {
            console.log(`==== CONNECTED- ${udoobludevice.id} === \n`);

            const subscribeAccelerometer = function (obj) {
                console.log(' accelerometer = x %d y %d z %d ', obj.x, obj.y, obj.z);

                udoobludevice.setLed(1, 1);
                onInterrupt(udoobludevice.id);
            };

            udoobludevice.subscribeDetectionAccLin(enableXAxis, enableYAxis, enableZAxis, threshold, function (error) {
                if(error) console.log(`detection sub err ${error}`);
                else console.log(`=== SUBSCRIBE detection ok`);

                udoobludevice.setLed(0, 1);
            }, subscribeAccelerometer);
        }
    ]);
}
