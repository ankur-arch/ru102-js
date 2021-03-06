const redis = require("./redis_client");
/* eslint-disable no-unused-vars */
const keyGenerator = require("./redis_key_generator");
const timeUtils = require("../../../utils/time_utils");
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();

  // START Challenge #7
  const windowMilli = opts.interval;
  const key = keyGenerator.getKey(
    `$limiter:${windowMilli}:${name}:${opts.maxHits}`
  );

  const transaction = client.multi();
  const timestamp = timeUtils.getCurrentTimestampMillis();
  const rand = Math.random();
  const remaining = timestamp - windowMilli;
  transaction.zadd(key, ...[timestamp, `${timestamp}-${rand}`]);
  transaction.zremrangebyscore(key, "-inf", remaining);
  transaction.zcard(key);
  const response = parseInt((await transaction.execAsync())[2], 10);
  return response > opts.maxHits ? -1 : opts.maxHits - response;
  // END Challenge #7
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
