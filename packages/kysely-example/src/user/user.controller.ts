import { KyselyTransactional } from "@anchan828/nest-kysely";
import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserRoleService } from "./user-role.service";
import { CreateUserDto, UserDto } from "./user.dto";
import { UserService } from "./user.service";

@Controller("/users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userRoleService: UserRoleService,
  ) {}

  @Get("/:userId")
  public async getById(@Param("userId") userId: string): Promise<UserDto> {
    const user = await this.userService.getById(userId);
    const userRole = await this.userRoleService.getByUserId(userId);
    return {
      id: user.id,
      name: user.name,
      role: userRole.role,
    };
  }

  @Post()
  @KyselyTransactional()
  public async create(@Body() body: CreateUserDto): Promise<UserDto> {
    const user = await this.userService.create(body.name);
    await this.userRoleService.create(user.id, body.role);

    return {
      id: user.id,
      name: user.name,
      role: body.role,
    };
  }

  @Post("error")
  @KyselyTransactional()
  public async createError(@Body() body: CreateUserDto): Promise<UserDto> {
    const user = await this.userService.create(body.name);
    await this.userRoleService.create(user.id, body.role);
    throw new BadRequestException("error");
  }
}
