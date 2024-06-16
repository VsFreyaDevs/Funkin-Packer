import { ApiError, ErrorCodes } from 'api/Errors';
import I18 from './utils/I18';

export default class ErrorHandler {
	public static translateError(e:any) {
		if(e instanceof ApiError){
			switch (e.code) {
				case ErrorCodes.INVALID_SIZE_ERROR:
					return I18.f("INVALID_SIZE_ERROR", e.args[0], e.args[1]);
				default:
					return I18.f("UNKNOWN_ERROR", e.args.join(", "));
			}
		}

		return e.toString();
	}
}