import { ApiError, ErrorCodes } from 'api/Errors';
import I18 from './locale/I18';

export default class ErrorHandler {
	public static translateError(e:any) {
		if(e instanceof ApiError){
			switch (e.code) {
				case ErrorCodes.INVALID_SIZE_ERROR:
					return I18.f("INVALID_SIZE_ERROR", e.args[0], e.args[1]);
				case ErrorCodes.NO_IMAGES_ERROR:
					return I18.f("NO_IMAGES_ERROR");
				case ErrorCodes.UNKNOWN_ERROR:
					return e.toString();
			}
		}

		return e.toString();
	}
}