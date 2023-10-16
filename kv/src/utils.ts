import { KvKey, KvKeyPart } from "./api";

function evalSinglePart(part: string): KvKeyPart {
  // Manual input
  const RE_NUM = /^[0-9][0-9]*(\.[0-9]*)?$/;
  const RE_BIGINT = /^[0-9]+n$/;
  const RE_U8 = /^0x([a-fA-F0-9][a-fA-F0-9])+$/;
  const RE_QUOTED_STRING = /^".*"$/;

  if (RE_NUM.test(part)) {
    return Number(part);
  } else if (RE_BIGINT.test(part)) {
    return BigInt(part.slice(0, -1));
  } else if (RE_U8.test(part)) {
    return Uint8Array.from(
      part
        .slice(2)
        .match(/.{1,2}/g)!
        .map((byte) => parseInt(byte, 16)),
    );
  } else if (RE_QUOTED_STRING.test(part)) {
    return part.slice(1, -1);
  } else if (part === "true") {
    return true;
  } else if (part === "false") {
    return false;
  } else {
    return part;
  }
}

export function queryToKvPrefix(input: string): KvKey {
  if (input === "") {
    return [] as KvKeyPart[];
  }

  // Raw JSON input
  if (input.startsWith("[") && input.endsWith("]")) {
    try {
      return JSON.parse(input) as KvKey;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  const result = [] as KvKeyPart[];

  for (let part of input.split(",")) {
    const trimmed = part.trim();
    result.push(evalSinglePart(trimmed));
  }
  return result;
}

export function kvKeyToString(key: KvKey): string {
  return key.map((i) => i.toString()).join(",");
}

export type ValueType = "string" | "json" | "number";

export interface ValueCheckResult {
  isValid: boolean;
  reason: string;
}
export function isValidValueType(
  value: unknown,
  valueType: string,
): ValueCheckResult {
  if (valueType === "string") {
    return {
      isValid: true,
      reason: "string is always valid",
    };
  }
  if (valueType === "number") {
    if (value === null || value === undefined) {
      return {
        isValid: false,
        reason: "number cannot be null",
      };
    }
    if (Number.isNaN(parseFloat(value as string))) {
      return {
        isValid: false,
        reason: "invalid number",
      };
    }
    return {
      isValid: true,
      reason: "OK",
    };
  }
  if (valueType === "json") {
    if (value === null) {
      return {
        isValid: false,
        reason: "json cannot be null",
      };
    }
    try {
      JSON.parse(value as string);
    } catch (e) {
      return {
        isValid: false,
        reason: "invalid json",
      };
    }
    return {
      isValid: true,
      reason: "OK",
    };
  }
  return {
    isValid: false,
    reason: "unknown valueType",
  };
}
