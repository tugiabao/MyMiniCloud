import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { System } from './system.entity';

@Entity('sensor_log')
export class SensorLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'system_name' })
  systemName: string;

  @ManyToOne(() => System, (system) => system.sensorLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'system_name', referencedColumnName: 'name' })
  system: System;

  // Luồng A - Cold Data: Chỉ lưu nhiệt độ và pH
  @Column('float', { nullable: true })
  temperature: number;

  @Column('float', { nullable: true })
  ph: number;

  // Các trường này có thể giữ lại để backward compatible hoặc nullable
  // nhưng logic mới sẽ ít dùng tới trong việc lưu log định kỳ
  @Column({ default: 1, nullable: true })
  liquid: number;

  @Column({ name: 'last_feed_time', type: 'timestamptz', nullable: true })
  lastFeedTime: Date;

  @Column({ name: 'last_ph_time', type: 'timestamptz', nullable: true })
  lastPhTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}