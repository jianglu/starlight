import { default as T } from './Table';
import { coerceToNumber, coerceToBoolean, coerceToString } from './utils';
import { getn } from './lib/table';
import { default as LuaError } from './LuaError';


function binaryArithmetic(left, right, metaMethodName, callback) {
	let mt, f;

	if ((left && left instanceof T && (mt = left.metatable) && (f = mt.get(metaMethodName)))
	|| (right && right instanceof T && (mt = right.metatable) && (f = mt.get(metaMethodName)))) {
		return f(left, right);
	} 

	if (typeof left !== 'number') {
		left = coerceToNumber(left, 'attempt to perform arithmetic on a %type value');
	}

	if (typeof right !== 'number') {
		right = coerceToNumber(right, 'attempt to perform arithmetic on a %type value');
	}

	return callback(left, right);
}


function concat(left, right) {
	let mt, f;

	if (
		(left && left instanceof T && (mt = left.metatable) && (f = mt.get('__concat')))
		|| (right && right instanceof T && (mt = right.metatable) && (f = mt.get('__concat')))
	) {
		return f(left, right);
	} else {
		right = coerceToString(right, 'attempt to concatenate a %type value');
		left = coerceToString(left, 'attempt to concatenate a %type value');
		return `${left}${right}`;
	}
}


function equal(left, right) {
	var mtl, mtr, f, result;

	if (right !== left 
		&& left && left instanceof T 
		&& right && right instanceof T 
		&& (mtl = left.metatable) 
		&& (mtr = right.metatable) 
		&& mtl === mtr 
		&& (f = mtl.getMember('__eq'))
	) {
		return !!f(left, right)[0];
	}

	return (left === right);
}


function mod(left, right) {
	if (
		right === 0 
		|| right === -Infinity 
		|| right === Infinity 
		|| global.isNaN(left) 
		|| global.isNaN(right)
	) {
		return NaN;
	}

	let absRight = Math.abs(right);
	let result = Math.abs(left) % absRight;

	if (left * right < 0) result = absRight - result;
	if (right < 0) result *= -1;

	return result;
}


function len(value) {
	let length, i;

	if (value === undefined) throw new LuaError('attempt to get length of a nil value');
	if (value instanceof T) return getn(value);
	
	if (typeof value == 'object') {
		let length = 0;
		for (let key in value) {
			if (value.hasOwnProperty(key)) {
				length++;
			}
		}
		return length;
	} 

	return value.length;
}


function unaryMinus(value) {
	var mt, f, result;

	if (value && value instanceof T && (mt = value.metatable) && (f = mt.get('__unm'))) {
		return f(value)[0];
	}

	if (typeof value !== 'number') {
		value = coerceToNumber(value, 'attempt to perform arithmetic on a %type value');
	}

	return -value;
}


export default {
	concat,
	len,

	eq: equal,
	unm: unaryMinus,
	bool: coerceToBoolean,

	neq: (...args) => !equal(...args),
	not: (...args) => !coerceToBoolean(...args),

	add: (left, right) => binaryArithmetic(left, right, '__add', (l, r) => l + r),
	sub: (left, right) => binaryArithmetic(left, right, '__sub', (l, r) => l - r),
	mul: (left, right) => binaryArithmetic(left, right, '__mul', (l, r) => l * r),
	div: (left, right) => {
		if (right === undefined) throw new LuaError('attempt to perform arithmetic on a nil value');
		return binaryArithmetic(left, right, '__div', (l, r) => l / r);
	},
	mod: (left, right) => binaryArithmetic(left, right, '__mod', mod),
	pow: (left, right) => binaryArithmetic(left, right, '__pow', Math.pow),
	lt: (left, right) => binaryArithmetic(left, right, '__lt', (l, r) => l < r),
	lte: (left, right) => binaryArithmetic(left, right, '__le', (l, r) => l <= r),
	
	gt(left, right) {
		return !this.lte(left, right);
	},
	
	gte(left, right) {
		return !this.lt(left, right);
	}
};

