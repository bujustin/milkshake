import md5 from "md5";

export const APP_NAME = "milkshake";
const RTM_API_KEY = "e44baab87700c76ed4698ba91ac14383";
const RTM_API_SECRET = "f3ae49a301715a5e";
const RTM_API_ENDPOINT = "https://api.rememberthemilk.com/services";

/**
 * Construct api signature according to https://www.rememberthemilk.com/services/api/authentication.rtm
 * Params:
 *  args : dict
 *  auth (optional) : bool - whether or not to use the RTM api auth endpoint, defaults to false
 * Returns:
 *  str - signed url
 **/
export function getSignedUrl(args, auth=false) {
  args["api_key"] = RTM_API_KEY
  args["format"] = "json"

  // start the signature with api secret 
  let signature = RTM_API_SECRET

  // construct signature with sorted parameters by key concatenated together
  const sortedArgKeys = Object.keys(args).sort();
  sortedArgKeys.forEach((key) => {
    signature += key + args[key];
  });

  // api_sig parameter is md5 hash of signature
  args["api_sig"] = md5(signature);
  const argsString = Object.keys(args)
    .map(key => `${key}=${args[key]}`)
    .join("&");

  return `${RTM_API_ENDPOINT}/${auth ? "auth" : "rest"}/?${argsString}`;
}

export function callRtmApi(url, callback) {
  fetch(url, {
    method: "GET",
    mode: "cors"
  })
    .then(r => r.json())
    .then(r => {
      callback(r["rsp"]["stat"] === "ok", r);
    })
    .catch(err => {
      callback(false, err);
    });
}

export function writeCookie(name, value) {
  const now = new Date();
  const expires = new Date(now.setMonth(now.getMonth() + 1)).toUTCString();
  document.cookie = `${APP_NAME}_${name}=${value}; expires=${expires}; path=/`;
}

export function readCookie(name) {
  const cookies = document.cookie.split(';').map(cookie => cookie.trim());
  return cookies.find(cookie => cookie.startsWith(`${APP_NAME}_${name}=`))?.split('=')[1];
}

export function downloadData(data, fileName, fileType) {
  // Create a Blob object from the CSV string
  const blob = new Blob([data], {
    type: fileType,
  });
  // Create a URL for the Blob object
  const url = URL.createObjectURL(blob);

  // Create a temporary link to download the file
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  // Release the URL and remove the link
  URL.revokeObjectURL(url);
  link.remove();
}
