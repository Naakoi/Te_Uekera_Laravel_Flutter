// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DocumentModel _$DocumentModelFromJson(Map<String, dynamic> json) =>
    DocumentModel(
      id: (json['id'] as num).toInt(),
      title: json['title'] as String,
      description: json['description'] as String?,
      filePath: json['file_path'] as String?,
      thumbnailPath: json['thumbnail_path'] as String?,
      price: json['price'] as String,
      publishedAt: json['published_at'] == null
          ? null
          : DateTime.parse(json['published_at'] as String),
      hasAccess: json['has_access'] as bool? ?? false,
      pageCount: json['page_count'] as int?,
    );

Map<String, dynamic> _$DocumentModelToJson(DocumentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'file_path': instance.filePath,
      'thumbnail_path': instance.thumbnailPath,
      'price': instance.price,
      'published_at': instance.publishedAt?.toIso8601String(),
      'has_access': instance.hasAccess,
      'page_count': instance.pageCount,
    };
