export class AppError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AppError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class MissingConfigError extends AppError {
	readonly fields: string[];

	constructor(fields: string[]) {
		super(`Missing configuration: ${fields.join(', ')}`);
		this.name = 'MissingConfigError';
		this.fields = fields;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class ApiError extends AppError {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class TimeoutError extends AppError {
	constructor() {
		super('Request timed out after 30 seconds.');
		this.name = 'TimeoutError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class EmptyResponseError extends AppError {
	constructor() {
		super('AI returned an empty response.');
		this.name = 'EmptyResponseError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
