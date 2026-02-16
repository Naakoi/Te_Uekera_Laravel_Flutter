import 'package:json_annotation/json_annotation.dart';

part 'document_model.g.dart';

@JsonSerializable()
class DocumentModel {
  final int id;
  final String title;
  final String? description;
  @JsonKey(name: 'file_path')
  final String? filePath;
  @JsonKey(name: 'thumbnail_path')
  final String? thumbnailPath;
  final String price;
  @JsonKey(name: 'published_at')
  final DateTime? publishedAt;
  @JsonKey(name: 'has_access', defaultValue: false)
  final bool hasAccess;
  @JsonKey(name: 'page_count')
  final int? pageCount;

  DocumentModel({
    required this.id,
    required this.title,
    this.description,
    this.filePath,
    this.thumbnailPath,
    required this.price,
    this.publishedAt,
    this.hasAccess = false,
    this.pageCount,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) => _$DocumentModelFromJson(json);
  Map<String, dynamic> toJson() => _$DocumentModelToJson(this);
}
