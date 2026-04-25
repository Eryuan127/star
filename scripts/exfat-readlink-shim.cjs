const fs = require("node:fs");

function shouldFallback(error) {
  return Boolean(error && (error.code === "EISDIR" || error.code === "EINVAL" || error.code === "UNKNOWN"));
}

function normalizeReadlinkError(error, path) {
  if (!shouldFallback(error)) return error;
  const normalized = new Error(`EINVAL: invalid argument, readlink '${path.toString()}'`);
  normalized.code = "EINVAL";
  normalized.errno = -4071;
  normalized.syscall = "readlink";
  normalized.path = path.toString();
  return normalized;
}

const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;

fs.readlink = function readlink(path, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }

  return originalReadlink.call(fs, path, options, (error, linkString) => {
    if (error && shouldFallback(error)) {
      callback(normalizeReadlinkError(error, path));
      return;
    }

    callback(error, linkString);
  });
};

fs.readlinkSync = function readlinkSync(path, options) {
  try {
    return originalReadlinkSync.call(fs, path, options);
  } catch (error) {
    if (shouldFallback(error)) {
      throw normalizeReadlinkError(error, path);
    }

    throw error;
  }
};

if (fs.promises?.readlink) {
  const originalPromisesReadlink = fs.promises.readlink.bind(fs.promises);

  fs.promises.readlink = async function readlink(path, options) {
    try {
      return await originalPromisesReadlink(path, options);
    } catch (error) {
      if (shouldFallback(error)) {
        throw normalizeReadlinkError(error, path);
      }

      throw error;
    }
  };
}
