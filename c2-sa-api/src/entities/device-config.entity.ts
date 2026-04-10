import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { System } from './system.entity';

@Entity('device_config')
export class DeviceConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'system_name' })
  systemName: string;

  @ManyToOne(() => System, (system) => system.deviceConfigs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'system_name', referencedColumnName: 'name' })
  system: System;

  @Column()
  device: string;

  @Column({ name: 'start_time', nullable: true })
  startTime: string;

  @Column({ name: 'end_time', nullable: true })
  endTime: string;

  @Column({ type: 'float', nullable: true })
  duration: number;

  @Column({ type: 'float', nullable: true })
  min: number;

  @Column({ type: 'float', nullable: true })
  max: number;

  @Column({ name: 'alert_delay', type: 'int', default: 0 })
  alertDelay: number; // Thời gian chờ trước khi báo động (phút)

  @Column({ nullable: true })
  value: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
