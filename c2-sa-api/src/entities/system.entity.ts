import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SensorLog } from './sensor-log.entity';
import { DeviceConfig } from './device-config.entity';
import { Profile } from './profile.entity';

@Entity('system')
export class System {
  @PrimaryColumn()
  name: string;

  @Column({ type: 'uuid', name: 'userId' })
  userId: string;

  @ManyToOne(() => Profile, (profile) => profile.systems, {
    onDelete: 'CASCADE', // Xóa User thì xóa luôn System
  })
  @JoinColumn({ name: 'userId' })
  user: Profile;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => SensorLog, (log) => log.system)
  sensorLogs: SensorLog[];

  @OneToMany(() => DeviceConfig, (config) => config.system)
  deviceConfigs: DeviceConfig[];
}
