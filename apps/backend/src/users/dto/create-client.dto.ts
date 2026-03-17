import { BasePersonDto } from './base-person.dto';

/**
 * DTO for creating a new client
 * Extends BasePersonDto for shared person fields
 */
export class CreateClientDto extends BasePersonDto {}
