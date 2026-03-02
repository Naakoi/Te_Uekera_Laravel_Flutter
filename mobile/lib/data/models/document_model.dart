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

  /// True when all document pages have been cached locally via [downloadDocument].
  /// This field is NOT serialised from the server — it is set locally.
  @JsonKey(includeFromJson: false, includeToJson: false)
  final bool isDownloaded;

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
    this.isDownloaded = false,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) =>
      _$DocumentModelFromJson(json);
  Map<String, dynamic> toJson() => _$DocumentModelToJson(this);

  DocumentModel copyWith({
    int? id,
    String? title,
    String? description,
    String? filePath,
    String? thumbnailPath,
    String? price,
    DateTime? publishedAt,
    bool? hasAccess,
    int? pageCount,
    bool? isDownloaded,
  }) {
    return DocumentModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      filePath: filePath ?? this.filePath,
      thumbnailPath: thumbnailPath ?? this.thumbnailPath,
      price: price ?? this.price,
      publishedAt: publishedAt ?? this.publishedAt,
      hasAccess: hasAccess ?? this.hasAccess,
      pageCount: pageCount ?? this.pageCount,
      isDownloaded: isDownloaded ?? this.isDownloaded,
    );
  }
}
