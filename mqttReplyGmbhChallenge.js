const awsIot = require('aws-iot-device-sdk-v2');
const TextDecoder = require('util').TextDecoder;
 
const decoder = new TextDecoder('utf-8');
 
const clientNamespace = 'ws-78dcdc47-81f3-4a84-a39e-82ff13557f68'// use your namespace f.e 'ns-53334';
const base = '../../device-certs'// specify path to device certificates './device/certs';
const mqttEndpoint = 'a3do8cgsrjxanm-ats.iot.eu-central-1.amazonaws.com';
const caCert = `${base}/AmazonRootCA1-openreply-raspberry.pem`;
const privateKey = `${base}/b1a09c5aed-private.pem.key`;
const deviceCert = `${base}/b1a09c5aed-certificate.pem.crt`;
 
let mqttConfig = awsIot.iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(deviceCert, privateKey)
  .with_certificate_authority_from_path(undefined, caCert)
  .with_client_id(clientNamespace)
  .with_endpoint(mqttEndpoint)
  .with_port(8883)
  .build();
 
const mqttClient = new awsIot.mqtt.MqttClient();
const mqttConnection = mqttClient.new_connection(mqttConfig);
 
async function handleDisconnect() {
  await mqttConnection.disconnect()
  console.log('\nDisconnected client')
}
const topic = `competition/color`
const toTopic = `attendee/payload`
async function main() {
  
  await mqttConnection.connect()
  console.log('Connected!')
  let payload = undefined
  let message = undefined
  await mqttConnection.subscribe(topic, awsIot.mqtt.QoS.AtMostOnce, async(topic, payload) => {
    try{
      message = JSON.parse(decoder.decode(payload));
      console.log(`Received message on topic ${topic}: ${message}`);
      payload = {
          "namespace": clientNamespace,
          "color": message.color
      }
  
      await mqttConnection.publish(toTopic, JSON.stringify(payload), awsIot.mqtt.QoS.AtMostOnce);
      console.log(`Published message to topic ${toTopic}: ${payload}`);
    }catch(err){
      console.error(`Error processing message: ${err}`);
    }
  });

  process.on('SIGINT', handleDisconnect);
}
 
main()