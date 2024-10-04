import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';
import { GetCurrentUserId, Public } from 'src/common/decorators';
import { User } from './entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HasRoles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { RolesEnum } from './entities/roles.enum';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Public()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('/me')
  @ApiBearerAuth('access-token')
  findMe(@GetCurrentUserId() userId: string): Promise<User> {
    return this.userService.findOne(userId);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(RolesEnum.ADMIN, RolesEnum.EMPLOYER)
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(RolesEnum.ADMIN, RolesEnum.EMPLOYER)
  @HttpCode(HttpStatus.OK)
  update(
    @GetCurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(RolesEnum.ADMIN, RolesEnum.EMPLOYER)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
