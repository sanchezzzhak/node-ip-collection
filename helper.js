
function iPv4ToUint32(iPv4) {
  const ipOctets = new Array(4).fill(0);
  const octets = iPv4.split('.');
  for (let i = 0, l = octets.length; i < l; i++) {
    ipOctets[i] = parseInt(octets[i], 10);
  }
  const result = (ipOctets[0] << 24) | (ipOctets[1] << 16) | (ipOctets[2] << 8) | ipOctets[3];
  return result >>> 0;
}
// Convert uint32 to IP
function uInt32ToIPv4(iPuInt32) {

  return [
    (iPuInt32 >> 24) & 0xFF,
    (iPuInt32 >> 16) & 0xFF,
    (iPuInt32 >> 8) & 0xFF,
    iPuInt32 & 0xFF
  ].join('.')

  // return `${(iPuInt32 >> 24) & 0xFF}.${(iPuInt32 >> 16) & 0xFF}.${(iPuInt32 >> 8) & 0xFF}.${iPuInt32 & 0xFF}`
}

function CIDRRangeToIPv4Range(CIDRs) {
  let ip = 0;
  let ipStart = 0;
  let ipEnd = 0;

  for (const CIDR of CIDRs) {
     const cidrParts = CIDR.split("/");
     ip = iPv4ToUint32(cidrParts[0]);
     const bits = parseInt(cidrParts[1], 10);
     if (ipStart === 0 || ipStart > ip) {
        ipStart = ip;
     }
     ip = ip | (0xFFFFFFFF >>> bits);
     if (ipEnd < ip) {
        ipEnd = ip;
     }
  }

  return [
    uInt32ToIPv4(ipStart),
    uInt32ToIPv4(ipEnd)
  ];
}

function iPv4RangeToCIDR(ipStart, ipEnd) {
  const cidr2mask = [
    0x00000000, 0x80000000, 0xC0000000,
    0xE0000000, 0xF0000000, 0xF8000000,
    0xFC000000, 0xFE000000, 0xFF000000,
    0xFF800000, 0xFFC00000, 0xFFE00000,
    0xFFF00000, 0xFFF80000, 0xFFFC0000,
    0xFFFE0000, 0xFFFF0000, 0xFFFF8000,
    0xFFFFC000, 0xFFFFE000, 0xFFFFF000,
    0xFFFFF800, 0xFFFFFC00, 0xFFFFFE00,
    0xFFFFFF00, 0xFFFFFF80, 0xFFFFFFC0,
    0xFFFFFFE0, 0xFFFFFFF0, 0xFFFFFFF8,
    0xFFFFFFFC, 0xFFFFFFFE, 0xFFFFFFFF,
  ];

  // Convert IP to unsigned integers.
  let ipStartUint32 = iPv4ToUint32(ipStart);
  let ipEndUint32 = iPv4ToUint32(ipEnd);

  // If the range is invalid, return an error.
  if (ipStartUint32 > ipEndUint32) {
    throw new Error(`start IP: ${ipStart} must be less than end IP: ${ipEnd}`);
  }
  const CIDRs = [];
  while (ipEndUint32 >= ipStartUint32) {
    let maxSize = 32;
    // Determine the maximum subnet mask available for the current IP address.
    while (maxSize > 0) {
      const maskedBase = ipStartUint32 & cidr2mask[maxSize - 1];
      if (maskedBase !== ipStartUint32) {
        break;
      }
      maxSize--;
    }
    // Check if the mask exceeds the range specified by the end IP address.
    const x = Math.log2(ipEndUint32 - ipStartUint32 + 1);
    const maxDiff = 32 - Math.floor(x);
    if (maxSize < maxDiff) {
      maxSize = maxDiff;
    }
    // Save the CIDR
    CIDRs.push(`${uInt32ToIPv4(ipStartUint32)}/${maxSize}`);
    // Increment the range by the subnet size and repeat the loop.
    ipStartUint32 += Math.pow(2, 32 - maxSize);
  }
  return CIDRs;
}

module.exports = {
  iPv4RangeToCIDR
}