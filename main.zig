const std = @import("std");
const http = @import("std").net.http;
const io = std.io;
const mem = std.mem;
const json = std.json;

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    const url = "https://alfalakai.openai.azure.com/openai/deployments/completion35/chat/completions?api-version=2023-03-15-preview";
    const YOUR_API_KEY = "YOUR_API_KEY_HERE";
    var headers = [_]http.Header{
        .{ .name = "Content-Type", .value = "application/json" },
        .{ .name = "api-key", .value = YOUR_API_KEY },
    };
    var messages = std.ArrayList(json.Value).init(allocator);
    defer messages.deinit();

    try messages.append(.Object(&[_]json.Field{
        .{ .name = "role", .value = .String("user") },
        .{ .name = "content", .value = .String("Say hi") },
    }));

    // Append a new message to the array
    try messages.append(.Object(&[_]json.Field{
        .{ .name = "role", .value = .String("user") },
        .{ .name = "content", .value = .String("Hello") },
    }));

    var body_buf: [1024]u8 = undefined;
    var body_stream = io.fixedBufferStream(&body_buf);
    try json.stringify(.{
        .allocator = allocator,
        .stream = &body_stream,
        .value = json.Value.Object(&[_]json.Field{
            .{ .name = "messages", .value = json.Value.Array(messages.toOwnedSlice()) },
            .{ .name = "max_tokens", .value = json.Value.Integer(800) },
            .{ .name = "temperature", .value = json.Value.Float(0.7) },
            .{ .name = "frequency_penalty", .value = json.Value.Integer(0) },
            .{ .name = "presence_penalty", .value = json.Value.Integer(0) },
            .{ .name = "top_p", .value = json.Value.Float(0.95) },
            .{ .name = "stop", .value = json.Value.Null },
        }),
    });
    const body_len = body_stream.pos;
    var stream =
        try http.connectToUrl(allocator, url, .post, &headers, mem.sliceTo(body_buf[0..body_len], u8));
    defer stream.deinit();
    var response = try http.Response.parse(.{}, &stream);
    defer response.deinit();
    const stdout = io.getStdOut().writer();
    try stdout.print("Status: {}\n", .{response.status_code});
    try stdout.writeAll(response.body);
}
