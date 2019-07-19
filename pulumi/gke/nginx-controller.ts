import * as k8s from "@pulumi/kubernetes";
import { clusterProvider } from "./cluster";
import * as gcp from "@pulumi/gcp";
import { ip, nginxVersion } from "./config";
import { primaryPool } from "./cluster";
import * as ingressController from "@forgerock/pulumi-nginx-ingress-controller";

// Create nginx namespace
export const nsnginx = new k8s.core.v1.Namespace("nginx", { 
    metadata: { 
        name: "nginx" 
    }
}, { dependsOn: [ primaryPool ], provider: clusterProvider });

// Check to see if static IP address has been provided. If not, create 1
function assignIp() {
    if (ip !== undefined) {
        return ip;
    } else {
        const staticIp = new gcp.compute.Address("cdm-ingress-ip", {
            addressType: "EXTERNAL",
        });
        return (staticIp.address).toString();
    }
}

export const lbIp = assignIp();

// Set values for nginx Helm chart
const nginxValues: ingressController.ChartArgs = {
    ip: lbIp,
    version: nginxVersion,
    clusterProvider: clusterProvider,
    namespace: (nsnginx.metadata.name).toString()
}

// Deploy Nginx Ingress Controller Helm chart
export const nginxControllerChart = new ingressController.NginxIngressController( nginxValues );
